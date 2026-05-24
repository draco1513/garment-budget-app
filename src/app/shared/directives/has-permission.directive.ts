import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Uso en template:
 * <div *appHasPermission="'BUDGET_APPROVE'">Solo admins ven esto</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {

  @Input('appHasPermission') permission = '';

  constructor(
    private template: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.auth.hasPermission(this.permission)) {
      this.viewContainer.createEmbeddedView(this.template);
    } else {
      this.viewContainer.clear();
    }
  }
}
